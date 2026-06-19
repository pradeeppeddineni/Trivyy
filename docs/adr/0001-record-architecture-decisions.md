# 1. Record architecture decisions

Date: 2026-06-19

## Status

Accepted

## Context

Significant decisions need a durable, reviewable record (DOD-5). Without one,
the reasoning behind choices is lost and later contributors re-litigate settled
questions.

## Decision

We record architecture decisions as short ADRs in `docs/adr/`, numbered
sequentially. Each ADR states context, the decision, and consequences. New
significant decisions are added in the same pull request that makes them.

## Consequences

- A lightweight, searchable history of why the system is the way it is.
- One more checklist item per significant PR (acceptable overhead).
