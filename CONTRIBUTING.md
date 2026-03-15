# Contributing to Agent Deals

Thanks for your interest in contributing! This guide will help you add or update deals.

## How to Add a New Deal

1. **Fork** this repository
2. **Edit** `deals.json` — add your deal to the appropriate category
3. **Submit** a pull request with a clear description

### Deal Format

Each deal in `deals.json` follows this structure:

```json
{
  "name": "Tool Name",
  "url": "https://tool-website.com",
  "deal": "Description of the deal or free tier.",
  "limits": "Specific limitations or quotas.",
  "type": "free-tier",
  "agent_notes": "Why this is useful for AI agents specifically."
}
```

### Deal Types

| Type | When to Use |
|------|-------------|
| `free-tier` | Always-free plan with usage limits |
| `open-source` | Free and open source software |
| `free-credits` | One-time or program-based free credits |
| `free-trial` | Time-limited trial period |
| `paid` | Paid service worth including for the ecosystem |

### Guidelines

- **Verify the deal** — make sure the free tier or deal is currently available
- **Be specific about limits** — include exact quotas, rate limits, and restrictions
- **Write agent notes** — explain why this tool matters for AI agents specifically
- **One deal per tool** — if a tool fits multiple categories, pick the most relevant one
- **Keep descriptions concise** — aim for 1-2 sentences for the deal description

## Updating an Existing Deal

If a deal has changed (new limits, pricing updates, etc.):

1. Update the relevant entry in `deals.json`
2. Note what changed in your PR description
3. Include a link to the source of the update

## Reporting Issues

If a deal is expired, incorrect, or the link is broken:

1. Open an issue with the label `deal-update`
2. Include the tool name and what's wrong
3. If possible, include the correct/updated information

## Categories

If you think a new category should be added, open an issue to discuss it before submitting a PR.

## Code of Conduct

Be kind, be helpful, and keep the focus on making AI agent development more accessible.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
