/*
 * These decorators are used to modify how classes are handled by 
 * the IOC container and application bootstrapping.
 */

import { Console } from "console"
import { decorate, unmanaged, injectable, interfaces } from "inversify";
import { fluentProvide, provide } from 'inversify-binding-decorators';
import { Log } from 'core/server/log';

export const serverMetadataTag = 'ioc:composition:root'

export function server(methodName: string = 'run') {
    return function (target: Function) {
        const existingMetadata = Reflect.getMetadata(serverMetadataTag, Reflect);
        if (existingMetadata) {
            throw new Error("the application may only define one entrypoint")
        }

        decorate(fluentProvide(target).inSingletonScope().done(), target);

        Reflect.defineMetadata(serverMetadataTag, target, Reflect);
    }
}

export function logger(serviceIdentifier: interfaces.ServiceIdentifier<Log> = null) {
    return function (target: any) {
        if (serviceIdentifier == null) {
            decorate(injectable(), Console);
            decorate(unmanaged(), Console, 0)
            decorate(unmanaged(), Console, 1)
        } else {
            decorate(fluentProvide(serviceIdentifier).inSingletonScope().done(), target)
        }
    }
}