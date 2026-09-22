# Cove

Cove is a retirement income calculator. It turns what you have saved, what you add each month, Social Security, and a pension into a monthly paycheck — then checks whether that paycheck lasts through the birthday you choose.

The default plan is a mid-career example. Change any number, or start from an early-career, near-retirement, or already-retired example. Your latest numbers stay in this browser.

## Run it locally

```bash
npm install
npm run dev
```

Open the URL printed in the terminal. Use **Download app** in the header to install Cove on a phone or computer.

Production:

```bash
npm run build
npm start
```

Check the projection math with:

```bash
npm test
```

## What the numbers mean

Amounts you type for spending, Social Security, and a pension are in **today's dollars**. Cove raises them with inflation on each birthday, so a result labeled "today's dollars" is buying power, not the future deposit amount.

- **Paycheck that lasts** is the most you can spend each month, in today's dollars, and still fund every month through the birthday you chose.
- **Full goal** spends your target even when the portfolio cannot keep up, and shows the age the money runs out.
- **Nest egg** is the portfolio on the retirement birthday, shown both in today's dollars and in that year's dollars.
- **Lower-return case** repeats the lasting paycheck with both return assumptions 1 percentage point lower.
- The **4%** figure is 4% of the nest egg at retirement, converted back to today's dollars. It does not include Social Security or a pension.

Returns compound monthly. Contributions stop at retirement and are deposited at the end of each month. Retirement withdrawals happen at the start of the month. Social Security and pension income are used before savings, and only after retirement has started. If that guaranteed income is more than spending, the extra goes back into the portfolio.

## What this leaves out

Taxes, investment fees, Social Security claiming rules, and a stretch of bad markets in a row are not modeled. Cove is an illustration, not a financial plan.
