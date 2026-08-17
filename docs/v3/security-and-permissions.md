# Security, permissions, and release review

Capabilities are visible during installation and update review. Host additions, user-provided origins, LAN access, secrets, system data, media controls, link actions, local storage, continuous animation, or Wasm logic are permission expansions.

The catalog records a normalized capability snapshot, package and Wasm hashes, Wasm imports/exports/size, source provenance, validation result, compatibility, and signing-key identity. Safe signed updates can install automatically. Expanded capabilities require approval. Revocation stops rendering, input, and logic while preserving settings/state in quarantine. An authorized rollback restores the last compatible approved package and state.

Feed data, credentials, and widget state remain on the user's PC. D1 contains catalog and review metadata; immutable reviewed packages and source archives are held privately in R2.
