import { Console } from "console"
import { logger } from 'core/ioc/decorators';
import { basename } from 'path';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { v4 } from 'uuid';
import { v4String as uuid } from 'uuid/interfaces';



@logger()
export abstract class Log extends Console {
    public constructor() {
        super(process.stdout, process.stderr);
    }
}

@logger(AppLog)
export class AppLog extends Log {
    public debug(msg: string, ...args: any[]) {
        super.debug(`${new Date().toISOString()} APP [DEBUG] ${msg}`, ... args);
    }

    public info(msg: string, ...args: any[]) {
        super.debug(`${new Date().toISOString()} APP [INFO] ${msg}`, ... args);
    }

    public warn(msg: string, ...args: any[]) {
        super.debug(`${new Date().toISOString()} APP [WARN] ${msg}`, ... args);
    }

    public error(msg: string, ...args: any[]) {
        super.error(`${new Date().toISOString()} APP [ERROR] ${msg}`, ... args);
    }

    public log(msg: string, ...args: any[]) {
        this.info(msg, ...args)
    }
}

class DerivedRequestTokens {
    public uuid: string
    public utcMs: number
    public utcIso: string

    constructor(request: Request) {
        let date = new Date();
        this.uuid = v4()
        this.utcMs = date.getTime();
        this.utcIso = date.toISOString();
    }
}

class DerivedResponseTokens {
    public durationMs: number
    public level: string

    constructor(requestTokens: RequestTokens, response: Response) {
        this.durationMs = Date.now() - requestTokens.utcMs
        this.level = "INFO"

        if (!response.headersSent) {
            this.level = "WARN"
        } else if (response.statusCode >= 400 && response.statusCode < 500) {
            this.level = "WARN"
        } else if (response.statusCode >= 500) {
            this.level = "ERROR"
        }
    }
}

type RequestTokens = Readonly<Request & DerivedRequestTokens>
type ResponseTokens = Readonly<Response & DerivedResponseTokens>

function zip<T, U>(first: T, second: U): Readonly<T & U> {
    let result = <T & U>{};
    for (let id in first) {
        if (id === 'host')
            continue;
        (<any>result)[id] = (<any>first)[id];
    }
    for (let id in second) {
        if (!result.hasOwnProperty(id)) {
            (<any>result)[id] = (<any>second)[id];
        }
    }
    return result;
}

@logger(RequestLog)
export class RequestLog extends Log {
    extractResponseTokens: ResponseTokens;

    public constructor() {
        super();
    }

    private logRequest(req: RequestTokens) {
        this.info(`${req.utcIso} WWW [INFO] ${req.uuid} ${req.method} ${req.path} ${req.headers['user-agent']}`)
    }

    // As long as Express is able to deliver something to the client,
    // this will be called for any status code
    private logResponse(req: RequestTokens, res: ResponseTokens) {
        let line = `${req.utcIso} WWW [${res.level}] ${req.uuid} ${req.method} ${res.statusCode} [${res.durationMs} ms] ${req.path}`;
        switch(res.level) {
            case 'INFO':
                this.info(line)
                break;
            case 'WARN': 
                this.warn(line)
                break;
            case 'ERROR':
                this.error(line)
                break;
        }
    }

    // if a client terminates the connection prematurely 
    // could happen if slow internet, or slow server and user hit ESC or Back
    // a lot of these events could indicate problems for end users
    private logClose(req: RequestTokens, res: ResponseTokens) {
        this.warn(`${req.utcIso} WWW [${res.level}] ${req.uuid} ${req.method} ${req.path} [${res.durationMs} ms] connection closed`)
    }

    public Logger(): RequestHandler {
        return (req: Request, res: Response, next: NextFunction) => {
            let requestTokens = zip(req, new DerivedRequestTokens(req))

            this.logRequest(requestTokens);
            res.addListener("finish", () => this.logResponse(requestTokens, zip(res, new DerivedResponseTokens(requestTokens, res))))
            res.addListener("close", () => {
                this.logClose(requestTokens, zip(res, new DerivedResponseTokens(requestTokens, res)))
            })

            next()
        }
    }
}
