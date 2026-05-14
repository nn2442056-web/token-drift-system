# Token Drift Detector

Real-time design token compliance system.

## Three Layers

1. **VS Code Extension** - Yellow underlines on hard-coded values
2. **GitHub Actions** - Blocks PRs with violations
3. **Dashboard** - Shows team compliance metrics

## Setup

```bash
# Install extension
cd token-drift-extension && npm install && npm run compile

# Start dashboard
cd dashboard && npm install && npm start
```

## Tokens File

Create `tokens/tokens.dtcg.json` with your design tokens in DTCG format.

```json
{
  "color": {
    "primary": {
      "$value": "#2563EB",
      "$type": "color"
    }
  }
}
```

## License

MIT