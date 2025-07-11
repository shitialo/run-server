"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateLast12MonthData = void 0;
function daysInMonth(month, year) {
  const daysInMonths = [
    31,
    year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  return daysInMonths[month];
}
async function generateLast12MonthData(model) {
  let last12Months = [];
  const CurrentDate = new Date();
  for (let i = 11; i >= 0; i--) {
    const endDate = new Date(
      CurrentDate.getFullYear(),
      CurrentDate.getMonth(),
      CurrentDate.getDate() -
        i * daysInMonth(CurrentDate.getMonth(), CurrentDate.getFullYear())
    );
    const startDate = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate() - daysInMonth(endDate.getMonth(), endDate.getFullYear())
    );
    const monthYear = endDate.toLocaleString("default", {
      month: "short",
      year: "numeric",
    });
    const count = await model.countDocuments({
      createdAt: {
        $gt: startDate,
        $lt: endDate,
      },
    });
    last12Months.push({ month: monthYear, count });
  }
  return { last12Months };
}
exports.generateLast12MonthData = generateLast12MonthData;
