import * as express from 'express';

import { mvc, metadata, reader } from "core/server/decorators"
import { Log, AppLog } from "core/server/log"
import { inject, injectable } from "inversify";
import { Response, NextFunction, Request } from "express"
import { basename } from 'path';
import { HttpController } from 'core/interfaces/http.controller';

@mvc.controller("/common", __dirname)
@mvc.statics("static")
export class CommonController extends HttpController {
    private instanceId: Number = Math.random() 

    public constructor(@inject(AppLog) log: Log) {
        super(log)
    }
}
