import { basename } from 'path';
import { injectable } from 'inversify';
import { Log } from 'core/server/log';

@injectable()
export abstract class HttpController {
    [x: string]: any;
    
    protected _log: Log;
   
    constructor(log: Log) {
        this._log = log;
    }
}
