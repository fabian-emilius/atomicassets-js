import { expect } from "chai";
import RpcApi from "../src/API/Rpc";

// tslint:disable-next-line:no-var-requires
const fetch = require("node-fetch");

describe("RPC API", () => {
    const api = new RpcApi("https://testnet.wax.pink.gg", "atomicassets", {
        fetch, rateLimit: 4,
    });

    const exampleAsset = {
        owner: "karlkarlkarl",
        id: "1099511627782",
    };

    it("fetch asset 1099511627782", async () => {
        const asset = await api.get_asset(exampleAsset.owner, exampleAsset.id);

        const result = await asset.toObject();

        expect(result).to.deep.equal(result);
    }).timeout(10000);

    it("test caching", async () => {
        const asset = await api.get_asset(exampleAsset.owner, exampleAsset.id);

        const result = await asset.toObject();

        expect(result).to.deep.equal(result);
    }).timeout(10000);

    it("fetch offers ", async () => {
        const offers = await api.get_account_offers(exampleAsset.owner);

        const result = await Promise.all(offers.map(async (offer) => await offer.toObject()));

        expect(result).to.deep.equal(result);
    }).timeout(20000);
});
