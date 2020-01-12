import RpcError from "../../Errors/RpcError";
import {AssetRow, CollectionRow, OfferRow, PresetRow, SchemeRow} from "./Cache";
import RpcApi from "./index";
import RpcOffer from "./Offer";

export default class RpcQueue {
    private elements: any[] = [];
    private interval: any = null;

    constructor(private readonly api: RpcApi, private readonly requestLimit = 4) {
        this.dequeue();
    }

    public async asset(owner: string, id: string, useCache: boolean = true): Promise<AssetRow> {
        return this.fetch_single_row(owner, "assets", id, this.api.cache.asset.bind(this.api.cache), useCache);
    }

    public async account_assets(account: string, useCache: boolean = true): Promise<AssetRow[]> {
        return this.fetch_all_rows(account, "assets", "id", "", "", this.api.cache.asset.bind(this.api.cache), useCache);
    }

    public async preset(id: number, useCache: boolean = true): Promise<PresetRow> {
        return this.fetch_single_row(this.api.contract, "presets", id, this.api.cache.preset.bind(this.api.cache), useCache);
    }

    public async scheme(name: string, useCache: boolean = true): Promise<SchemeRow> {
        return this.fetch_single_row(this.api.contract, "schemes", name, this.api.cache.scheme.bind(this.api.cache), useCache);
    }

    public async collection(name: string, useCache: boolean = true): Promise<CollectionRow> {
        return this.fetch_single_row(this.api.contract, "collections", name, this.api.cache.collection.bind(this.api.cache), useCache);
    }

    public async offer(id: number, useCache: boolean = true): Promise<OfferRow> {
        return this.fetch_single_row(this.api.contract, "offers", id, this.api.cache.offer.bind(this.api.cache), useCache);
    }

    public async account_offers(account: string, useCache: boolean = true): Promise<OfferRow[]> {
        const rows: any[][] = await Promise.all([
            this.fetch_all_rows(
                this.api.contract, "offers", "offer_sender", account, account,
                this.api.cache.offer.bind(this.api.cache), useCache, 2, "name",
            ),
            this.fetch_all_rows(
                this.api.contract, "offers", "offer_recipient", account, account,
                this.api.cache.offer.bind(this.api.cache), useCache, 3, "name",
            ),
        ]);

        return rows[0].concat(rows[1]);
    }

    public stop() {
        clearInterval(this.interval);

        this.interval = null;
    }

    private dequeue() {
        this.interval = setInterval(async () => {
            if(this.elements.length > 0) {
                this.elements.shift()();
            }
        }, Math.ceil(1000 / this.requestLimit));
    }

    private async fetch_single_row(
        scope: string, table: string, match: any,
        cache: any = null, useCache = true,
        indexPosition = 1, keyType = "",
    ) {
        let data = useCache ? cache(match) : null;

        return new Promise((resolve, reject) => {
            if(data) {
                return resolve(data);
            }

            this.elements.push(async () => {
                data = useCache ? cache(match) : null;

                if(data) {
                    this.elements.shift()();

                    return resolve(data);
                }

                try {
                    const resp = await this.api.get_table_rows({
                        code: this.api.contract, table, scope,
                        limit: 1, lower_bound: match, upper_bound: match,
                        index_position: indexPosition, key_type: keyType,
                    });

                    if(resp.rows.length !== 1) {
                        return reject(new RpcError("row not found '" + match + "'"));
                    }

                    return resolve(cache(match, resp.rows[0]));
                } catch (e) {
                    return reject(e);
                }
            });
        });
    }

    private async fetch_all_rows(
        scope: string, table: string, tableKey: string,
        lowerBound = "", upperBound = "",
        cache: any, useCache = true,
        indexPosition = 1, keyType = "",
    ): Promise<any[]>  {
        return new Promise(async (resolve, reject) => {
            const resp: {more: boolean, rows: any[]} = await this.api.get_table_rows({
                code: this.api.contract, scope, table,
                lower_bound: lowerBound, upper_bound: upperBound, limit: 100,
                index_position: indexPosition, key_type: keyType,
            });

            if(resp.more && indexPosition === 1) {
                this.elements.unshift(async () => {
                    try {
                        let next = await this.fetch_all_rows(
                            scope, table, tableKey,
                            resp.rows[resp.rows.length - 1][tableKey],
                            upperBound, cache, useCache,
                        );
                        next.shift();

                        next = next.map((element) => {
                            return cache(element[tableKey], element);
                        });

                        resolve(resp.rows.concat(next));
                    } catch (e) {
                        reject(e);
                    }
                });
            } else {
                resolve(resp.rows);
            }
        });
    }
}