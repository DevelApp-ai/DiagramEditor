# Release Strategy

## Versioning

- Follow semantic versioning: MAJOR.MINOR.PATCH.

## Changelog

- Maintain a release changelog for every version.

## Rollout

- Promote release candidate through staging before production.
- Require green CI and test suite before release.

## Rollback

- Keep previous stable artifact available for immediate rollback.
- Document rollback decision and impact after every production incident.
