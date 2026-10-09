# Hosting options for this companion

Official product pages checked October 8, 2026 (Costa Rica). USD prices; advertised promotions, region options, and taxes can change. These are product-page observations, not account-specific checkout quotes.

| Option | Advertised price | Fit for this app |
|---|---|---|
| [Neon Free](https://neon.com/pricing) + existing Vercel | $0 database | Recommended. Managed PostgreSQL; Free lists 1 GB Postgres storage and 100 CU-hours per project, 5 GB egress. Compute suspends after five minutes idle and resumes on requests. Exhausted compute/egress can suspend service until the next billing period; storage limits block writes. |
| [Spaceship shared hosting Essential](https://www.spaceship.com/web-hosting/) | $19.88 first year; $28.88/year renewal | Lists MySQL/MariaDB and Node.js through v24, not PostgreSQL. Not a drop-in database host for this PostgreSQL implementation. Would require a MySQL adapter and confirmation of remote DB access or moving app hosting; avoid buying just for this database. |
| [Spaceship Standard 1 VPS](https://www.spaceship.com/hosting/virtual-machines/) | $0.007/hour; estimated $4.90/month | 1 core, 2 GiB RAM, 25 GiB storage. Can install PostgreSQL and host the Next.js app together. Requires OS/database maintenance, TLS, firewall, backups, monitoring, and restore procedures; backups or extras can add cost. Price is an estimate, not a guaranteed fixed monthly total. |
| [Spaceship Hyperlift](https://www.spaceship.com/starlight-cloud/hyperlift/) | $0.005/hour; estimated $3.60/month | Container app hosting with GitHub/Dockerfile deployment. Product page does not establish managed PostgreSQL or durable database volumes/backups. Confirm database persistence with Spaceship before considering it for cloud saves. It is an alternative app host rather than a verified database replacement. |
| [Supabase Free / Pro](https://supabase.com/pricing) | Free $0; Pro from $25/month | Free includes 500 MB database and pauses projects after one week inactive. Pro pricing is not the baseline cost of Supabase Free. Deleted-project data is not restored merely by moving services. |

Recommendation: keep the domain at Spaceship and keep Vercel, then add Neon Free. Domain registration and data hosting can remain independent. This is the lowest advertised additional cost and avoids maintaining a server. If keeping both hosting and data at Spaceship matters more than administration, a VPS is the verified infrastructure option, but moving production is a separate deployment decision.

No paid service has been purchased and no production hosting has been moved. The implementation uses standard PostgreSQL, allowing a future move to a suitably configured VPS without replacing authentication again.
