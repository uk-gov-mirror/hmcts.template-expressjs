const { Express, Logger } = require('@hmcts/nodejs-logging')

import * as bodyParser from "body-parser";
const config = require('config')
import cookieParser from "cookie-parser";
import express from "express";
import { Helmet } from "modules/helmet";
import * as path from "path";
import { RouterFinder } from "router/routerFinder";
import favicon from "serve-favicon";
import { HTTPError } from "HttpError";
import { Nunjucks } from 'modules/nunjucks'

const env = process.env.NODE_ENV || "development";
const developmentMode = env === 'development'

export const app = express();
app.locals.ENV = env;

// setup logging of HTTP requests
app.use(Express.accessLogger());

const logger = Logger.getLogger("app");


new Nunjucks(developmentMode)
  .enableFor(app)
// secure the application by adding various HTTP headers to its responses
new Helmet(config.get("security")).enableFor(app);

// view engine setup
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(favicon(path.join(__dirname, "/public/img/favicon.ico")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));


app.use("/", RouterFinder.findAll(path.join(__dirname, "routes")));

// returning "not found" page for requests with paths not resolved by the router
app.use((req, res, next) => {
  res.status(404);
  res.render("not-found");
});

// error handler
app.use((err: HTTPError, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`${err.stack || err}`);

  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = env === "development" ? err : {};

  res.status(err.status || 500);
  res.render("error");
});
