import { environment } from "src/environments/environment";

export class UrlHelperService {
    getUrl(key: string) {
        const host = environment[key];
        if (host) {
            return `${host.protocol}://${host.host}${host.port ? ':' + host.port : ''}/${host.path}`;
        }
    }
}