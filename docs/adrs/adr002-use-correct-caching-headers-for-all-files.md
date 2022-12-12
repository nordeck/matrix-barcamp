# ADR002: Use Correct Caching Headers for all Files

Status: accepted

<!-- These documents have names that are short noun phrases. For example, "ADR001: Deployment on Ruby on Rails 3.0.10" or "ADR009: LDAP for Multitenant Integration" -->

## Context

<!--
This section describes the forces at play, including technological, political, social, and project local. These forces are probably in tension, and should be called out as such. The language in this section is value-neutral. It is simply describing facts. -->

Caching is a key feature in HTTP.
But caching could also potentially lead to stale content if the wrong files are cached.
We want to make sure that all users receive a newly deployed widget version as soon as possible.
This should not only work for new version updates, but also for reconfigurations (ex: new environment variables, updated translations) of the same version.

## Decision

<!-- This section describes our response to these forces. It is stated in full sentences, with active voice. "We will ..." -->

We will enable caching for all files that have a unique name (ex: a hash in a name) and will disable caching for all files that are not unique.
Caching should only be disabled for files that are reasonably small.

## Consequences

<!-- This section describes the resulting context, after applying the decision. All consequences should be listed here, not just the "positive" ones. A particular decision may have positive, negative, and neutral consequences, but all of them affect the team and project in the future. -->

We will use the following configurations:

1. `Cache-Control "public, max-age=0, must-revalidate"`:
   - `index.html`: should never be cached because it is the entrypoint of the applications.
   - `locales/*`: locales are not uniquely named between versions and might be updated during a deployment.
2. `Cache-Control \"public, max-age=3600\"`:
   - `static/*`: all CSS, JS, and media files are bundled with a hash in the filename. Files with the same name will _always_ have the same content and can be safely cached.

The setting _1._ will still order the browser to use features such as `If-Match` or `If-Modified-Since` to save bandwidth.
In fact, the browser will still cache the result, but it will always ask the server if the cached version is still up-to-date before presenting it to the user.

<!-- This template is taken from a blog post by Michael Nygard http://thinkrelevance.com/blog/2011/11/15/documenting-architecture-decisions -->
