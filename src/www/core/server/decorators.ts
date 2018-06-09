import { decorate, injectable, interfaces, named, inject, getServiceIdentifierAsString } from 'inversify';
import { provide, fluentProvide } from 'inversify-binding-decorators'
import { RequestHandler } from 'express'
import { HttpController,  } from 'core/interfaces/http.controller'
import { tagParameter } from 'inversify/dts/annotation/decorator_utils';
import { Metadata } from 'inversify/dts/planning/metadata'


let up = (s: string) => s.toUpperCase()

export namespace injector {
    export function controller<T extends HttpController>(
        controller: interfaces.ServiceIdentifier<T>): Function 
    {
        let sid = getServiceIdentifierAsString(controller);
        return function(target: any, targetKey: string, index?: number | undefined): void 
        {
            decorate(inject(HttpController), target, index)
            decorate(named(sid), target, index)
        }
    }
}

const singleton = (target: any) => {
    return fluentProvide(HttpController)
        .inSingletonScope().when(r => {
            return r.target.matchesNamedTag(target.name) || r.target.isArray()
        })
        .onActivation((context, injectable) => {
            return injectable;
        })
        .done(true);
};

export namespace metadata {
    export let controllerId = 'mvc:controller';
    export let httpMethodId = 'mvc:http:method';
    export let staticsPropertyId = 'mvc:statics';
    export let viewsPropertyId = 'mvc:views'
}

export namespace mvc {
    export function controller(path: string, dirname: string, ...middleware: RequestHandler[]) {
        return function (target: any) {
            let currentMetadata = {
                middleware: middleware,
                path: path,
                dirname: dirname,
                target: target
            };

            decorate(singleton(target), target);

            Reflect.defineMetadata(metadata.controllerId, currentMetadata, target);
        }
    }

    export function statics(path: string = 'static', ...middleware: RequestHandler[]) {
        let _path = path || 'static' // explicitly passing null is not allowed

        return function (target: any) {
            assertController(target, statics.name)
            Reflect.defineMetadata(metadata.staticsPropertyId, _path, target);
        }
    }

    export function views(path: string = 'views') {
        let _path = path || 'views' // explicitly passing null is not allowed
        return function (target: any) {
            assertController(target, views.name);
            Reflect.defineMetadata(metadata.viewsPropertyId, _path, target);
        }
    }

    export namespace http {
        export function get(path: string, ...middleware: RequestHandler[]) {
            return httpMethod("get", path, ...middleware);
        }

        export function post(path: string, ...middleware: RequestHandler[]) {
            return httpMethod("post", path, ...middleware);
        }

        export function httpPut(path: string, ...middleware: RequestHandler[]) {
            return httpMethod("put", path, ...middleware);
        }
    }

    

    export type HttpVerb = 'get' | 'post' | 'put' | 'delete' 
    function httpMethod(httpVerb: HttpVerb, path: string, ...middleware: RequestHandler[]) {
        return function (target: any, methodName: string, method: any) {

            let currentMetadata = {
                methodName,
                httpVerb,
                middleware,
                path,
                method: method.value
            };

            let metadataList: any[] = [];

            const existingMetadata = Reflect.getMetadata(metadata.httpMethodId, target.constructor) || [];
            const combinedMetadata = [currentMetadata, ...existingMetadata];

            Reflect.defineMetadata(metadata.httpMethodId, combinedMetadata, target.constructor);
        };
    }
}

export namespace reader {
    export function getViewsPath(controller: any): string {
        return null
    }

    export function getStaticsPath(controller: any): string {
        return null
    }

    export function getHttpMethods(controller: any): string[] {
        return null
    }
}

//
// The expressions for each decorator are evaluated top-to-bottom.
// The results are then called as functions from bottom-to-top.
//
// Add meaningful error message if a controller is not setup properly
//
function assertController(target: any, decorator: string): void {
    let controllerMetadata = Reflect.getMetadata(metadata.controllerId, target.constructor)
    
    if (!controllerMetadata) {
        // TODO: 
        //throw new Error(`${decorator} can only be applied to a controller`)
    }
}