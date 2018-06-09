import { server } from 'core/ioc/decorators';

import { basename } from 'path'
import { Dictionary } from 'core/interfaces/dictionary'
import { CanRun } from 'core/interfaces/can.run';
import { multiInject, inject, named } from 'inversify';
import { reader, metadata, mvc, injector } from 'core/server/decorators';
import { HttpController } from 'core/interfaces/http.controller';
import { registerPartial, localsAsTemplateData, __express as hbs } from 'hbs';
import { Router, Application, NextFunction, Request, Response } from 'express';
import { RequestLog, Log, AppLog } from 'core/server/log';
import express from 'express';
import glob from 'glob';
import path from 'path';
import fs from 'fs';
import _ from 'lodash';
import { __values } from 'tslib';

@server()
export class ExpressServer implements CanRun {
    private _requestLog: RequestLog;
    private _appLog: Log;
    private _application: Application;
    private _controllers: HttpController[];
    private _appRouter: Router;
    private _staticsRouter: Router;

    constructor(
        @multiInject(HttpController) controllers: HttpController[],
        @inject(RequestLog) requestLog: RequestLog,
        @inject(AppLog) appLog: Log
    ) {
        this._requestLog = requestLog;
        this._appLog = appLog;
        this._controllers = controllers;
        this._application = express();
        this._appRouter = Router();
        this._staticsRouter = Router();
    }

    private build() {
        let _appRouter = this._appRouter;
        let _staticsRouter = this._staticsRouter;
        let _application = this._application;
        let _controllers = this._controllers;

        _application.use(_appRouter);
        _application.use(_staticsRouter);

        let sP = path.normalize(`./bower_components`) 
        _staticsRouter.use('/lib', express.static(sP))

        _application.set('views', []);

        if (!_controllers) {
            throw new Error('no controllers loaded')
        } else {
            _controllers.forEach((controller) => {
                let controllerMetadata = Reflect.getMetadata(metadata.controllerId, controller.constructor)
                this.setStatics(controller, controllerMetadata);
                this.setViews(controller, controllerMetadata);
            })

            this.assertViewNamesDoNotCollide(_application);

            _application.set('view engine', 'hbs')
            _application.engine('.hbs', hbs)
            // _application.engine('.hbs', ExpressHandlebarsSkate.Engine)

            _appRouter.use(this._requestLog.Logger())

            _controllers.forEach((controller) => {
                let controllerMetadata = Reflect.getMetadata(metadata.controllerId, controller.constructor)
                this.setRoutes(controller, controllerMetadata);
            })
        }

        
    }

    private assertViewNamesDoNotCollide(_application: Application) {
        let views: string[] = _application.get('views');
        let allViews = _.flatten(views.map(x => glob.sync(`${x}/**/*.hbs`).map(y => {
            return {
                name: path.parse(y).name,
                full: path.relative(`${x}/../..`, y)
            };
        })));

        let groups = _.groupBy(allViews, 'name');
        let duplicateViews = _.pickBy(groups, x => x.length > 1);
        
        if (_.keys(duplicateViews).length > 0) {
            let paths = _.flatMap(duplicateViews, x => x).map(x => x.full).join(', ');
            throw new Error('view names must be unique across all modules. conflicts: ' + paths);
        }
    }

    private setStatics(controller: HttpController, controllerMetadata: any) {
        let _application = this._application;

        let staticsPathRel = Reflect.getMetadata(metadata.staticsPropertyId, controller.constructor) || './static';
        let staticsPathUrl = path.normalize(`${controllerMetadata.path}/${staticsPathRel}`);
        let staticsPathAbs = path.normalize(`${controllerMetadata.dirname}/${staticsPathRel}`);

        this._appRouter.use(staticsPathUrl, express.static(staticsPathAbs));
    }

    private setViews(controller: HttpController, controllerMetadata: any) {
        let _application = this._application;
        let appViewsPaths: string[] = _application.get('views')

        let modulePath = `${controllerMetadata.dirname}`
        let modulesPath = `${controllerMetadata.dirname}/..`

        let viewsDir = Reflect.getMetadata(metadata.viewsPropertyId, controller.constructor) || './views';
        let viewsPath = path.normalize(`${modulePath}/${viewsDir}`)
        let moduleViews = path.normalize(`${viewsPath}/**/*.hbs`);

        glob.sync(moduleViews).forEach(x => {
            let name = path.relative(viewsPath, x).replace('.hbs', '').replace(/\//g, '.');
            let template = fs.readFileSync(x).toString()

            registerPartial(name, template)
        })

        appViewsPaths.push(viewsPath)

        localsAsTemplateData(_application);
    }

    private setRoutes(controller: HttpController, controllerMetadata: any) {
        let _router = this._appRouter;
        let httpMethods = Reflect.getMetadata(metadata.httpMethodId, controller.constructor) || [];
        httpMethods.forEach((httpMethod: any) => {
            let httpVerb: mvc.HttpVerb = httpMethod.httpVerb;
            let method = _router[httpVerb].bind(_router);
            let route = path.normalize(`${controllerMetadata.path}/${httpMethod.path}`);
            method(route, controller[httpMethod.methodName].bind(controller));
        });
    }

    run(args: Dictionary<string | number>): void {
        this.build();

        let port = args.port || 4000;

        this._application.listen(port);
    }
}