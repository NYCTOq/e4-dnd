# v5.123B1 Search Alias Ambiguity Assertion Hotfix

This hotfix repairs two incorrect certification assumptions in v5.123B:

- Canonical visible labels must rank first, while short labels only need to keep their own route discoverable because short labels may legitimately collide with other page content.
- Alias ambiguity is reported separately from missing aliases. A canonical alias is a blocker only when its target route is absent from the result set.

No production runtime behavior is changed.
