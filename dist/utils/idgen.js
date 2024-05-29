"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("k6/x/fs"));
const filePath = "/tmp/k6-ocpi-ids.json";
class IDGenerator {
    next(namespace, min) {
        let num = 0;
        let json = {};
        fs_1.default.update(filePath, (data) => {
            min = min || 1;
            try {
                json = JSON.parse(data);
            }
            catch (e) {
                console.log("Error parsing JSON data: " + e);
                json = {};
            }
            if (typeof json !== "object") {
                console.log("JSON data is not an object");
                json = {};
            }
            if (json[namespace] === undefined || json[namespace] < min) {
                json[namespace] = min;
            }
            else {
                json[namespace]++;
            }
            num = json[namespace];
            return JSON.stringify(json).trim();
        });
        return num;
    }
}
exports.default = new IDGenerator();
