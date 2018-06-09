
import { Container, METADATA_KEY, interfaces } from "inversify"
import { serverMetadataTag } from './decorators'
import { buildProviderModule } from 'inversify-binding-decorators'
import { CanRun } from 'core/interfaces/can.run';

// inversion of control
export class Ioc {
    _container: Container;

    constructor() {
        var container = new Container();

        container.load(buildProviderModule());

        this._container = container;
    }

    /** 
     * Search Reflect metadata for the composition root 
     */
    getServer() {
        let allKeys = Reflect.getMetadataKeys(Reflect);
        let identifier = Reflect.getMetadata(serverMetadataTag, Reflect);

        if (!identifier) {
            throw new Error("no server has been tagged\ndid you forget to annotate the server()?")
        }

        let server = this._container.get<CanRun>(identifier);

        if (!server) {
            throw new Error("inversify could not resolve the server instance")
        }

        return server;
    }
}


