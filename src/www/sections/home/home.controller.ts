import * as express from 'express';

import { mvc, metadata, reader } from "core/server/decorators"
import { Log, AppLog } from "core/server/log"
import { inject, injectable } from "inversify";
import { Response, NextFunction, Request } from "express"
import { basename } from 'path';
import { HttpController } from 'core/interfaces/http.controller';

@mvc.controller("/", __dirname)
export class HomeController extends HttpController {
    private instanceId: Number = Math.random() 

    public constructor(@inject(AppLog) log: Log) {
        super(log)
    }

    @mvc.http.get("/")
    public get(req: Request, res: Response, next: NextFunction) {
        res.app.locals.title = "Title"
        res.render('index');
    }

    @mvc.http.get('/favicon.ico')
    public favicon(req: Request, res: Response, next: NextFunction) {
        res.sendFile('./static/favicon.png', { root: __dirname })
    }

    @mvc.http.get('/sitemap.xml')
    public sitemap(req: Request, res: Response, next: NextFunction) {
        res.sendFile('./static/sitemap.xml', { root: __dirname,  })
    }

    @mvc.http.get('/robots.txt')
    public robots(req: Request, res: Response, next: NextFunction) {
        res.sendFile('./static/robots.txt', { root: __dirname,  })
    }
}
