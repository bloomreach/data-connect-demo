Configure your settings file like:

```
{
    "BRSM_ACCOUNT_ID": 6484,
    "BRSM_CATALOG_NAME": "pacific_devtrial",
    "BEARER_API_KEY": <<The Key issued to you>>
}
```

Then npm install

run examples:

node index.js ./examples/example_name

Note: If you delete lots of records at the same time, you can set a header: “BR-IGNORE-DOCUMENT-COUNT-DROP”: true - so the platform ignores the sudden drop in index size. This should be used only as an exception as it is a system guardrail.
