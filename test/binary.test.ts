import { expect } from "chai";

import {
    base58_decode,
    base58_encode,
    hex_decode,
    hex_encode,
    packInteger,
    signInteger,
    unpackInteger
} from "../src/Binary";
import {prepare} from "../src/Serialization/State";

describe("Binary", () => {
    it("sign negative integer", () => {
        expect(Number(signInteger(BigInt(-534), 2))).to.equal(65002);
    });

    it("sign positive integer", () => {
        expect(Number(signInteger(BigInt(534), 2))).to.equal(534);
    });

    it("pack integer below 127", () => {
        expect(packInteger(BigInt(5))).to.deep.equal(new Uint8Array([0b10000101]));
    });

    it("unpack integer below 127", () => {
        const data = new Uint8Array([0b10000101]);

        expect(Number(unpackInteger(prepare(data)))).to.equal(5);
    });

    it("pack 2 bytes", () => {
        expect(packInteger(BigInt(230))).to.deep.equal(new Uint8Array([0b01100110, 0b10000001]));
    });

    it("unpack 2 bytes", () => {
        const data = new Uint8Array([0b01100110, 0b10000001]);

        expect(Number(unpackInteger(prepare(data)))).to.equal(230);
    });

    it("pack max integer", () => {
        expect(packInteger(BigInt(4294867286), 4)).to.deep.equal(new Uint8Array([0b01010110, 0b01110010, 0b01111001, 0b01111111, 0b1111]));
    });

    it("unpack max integer", () => {
        const data = new Uint8Array([0b01010110, 0b01110010, 0b01111001, 0b01111111, 0b1111]);

        expect(Number(unpackInteger(prepare(data), 4))).to.equal(4294867286);
    });

    it("base58 encode", () => {
        expect(base58_encode(hex_decode("122037b8d00f5a5b37181c8fa8a05f7446b2ea06a0bbaaba3f1e95e4e97726a5e67c"))).to.equal("QmS6AaitSdut3Te4fagW6jgfyKL73A1NBSSt3K38vQP9xf");
    });

    it("base58 decode", () => {
        expect(hex_encode(base58_decode("QmS6AaitSdut3Te4fagW6jgfyKL73A1NBSSt3K38vQP9xf"))).to.equal("122037b8d00f5a5b37181c8fa8a05f7446b2ea06a0bbaaba3f1e95e4e97726a5e67c");
    });
});
