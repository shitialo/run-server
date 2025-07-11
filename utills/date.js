"use strict";
// All dates functions
Object.defineProperty(exports, "__esModule", { value: true });
exports.ONE_DAY_IN_MS =
  exports.twentyMinutesFromNow =
  exports.fifteenMinutesFromNow =
  exports.fiveMinutesFromNow =
  exports.thirtyDaysFromNow =
    void 0;
const thirtyDaysFromNow = () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
exports.thirtyDaysFromNow = thirtyDaysFromNow;
const fiveMinutesFromNow = () => new Date(Date.now() + 5 * 60 * 1000);
exports.fiveMinutesFromNow = fiveMinutesFromNow;
const fifteenMinutesFromNow = () => new Date(Date.now() + 15 * 60 * 1000);
exports.fifteenMinutesFromNow = fifteenMinutesFromNow;
const twentyMinutesFromNow = () => new Date(Date.now() + 20 * 60 * 1000);
exports.twentyMinutesFromNow = twentyMinutesFromNow;
exports.ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;
