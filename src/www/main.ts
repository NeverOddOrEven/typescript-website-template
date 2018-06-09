
import 'core/ioc/imports'
import { Ioc } from 'core/ioc/ioc'

export default class Main {
    private _ioc: Ioc;

    constructor() {
        this._ioc = new Ioc();
    }

    public run() {
        var port = process.env.PORT || 7000;
        var server = this._ioc.getServer();

        server.run({ port: port })
    }   
}

let application = new Main()
application.run()
