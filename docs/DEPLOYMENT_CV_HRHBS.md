# Deployment — cv.hrhbs.com

Deploy the production build through the approved hosting pipeline, configure `cv.hrhbs.com` as the canonical host, and retain `seerati.hrhbs.com` as the fallback. Configure DNS according to the hosting provider’s required CNAME/A records, enforce HTTPS, and set canonical metadata to `https://cv.hrhbs.com`.

Environment variable names must be documented without values. Never commit `.env` files or client-side AI secrets. Confirm `Cache-Control: no-store` for sensitive AI and import responses before production activation.
