import { ICliConfig } from './cli_schema';
export declare const doPreChecks: (jsonResultsPath: string, configFile: string) => Promise<{
    status: "error" | "ok";
    message?: string;
    jsonPath?: string;
    configPath?: string;
    config?: ICliConfig;
}>;
export default doPreChecks;
