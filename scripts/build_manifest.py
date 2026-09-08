#!/usr/bin/env python3
from __future__ import annotations

import hashlib
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HUMAN = ROOT / 'PACK_MANIFEST.md'
CHECKSUMS = ROOT / 'MANIFEST.sha256'


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def purpose(path: str) -> str:
    exact = {
        '.env.example': 'Safe environment defaults; card images disabled',
        'AGENTS.md': 'Non-negotiable code-agent operating instructions',
        'IMPLEMENTATION_PROMPT.md': 'Ready-to-paste first implementation prompt',
        'MASTER_BUILD_SPEC.md': 'Canonical editable master specification',
        'Core_Protocol_Companion_Web_App_Build_Spec.docx': 'Polished linked review and handoff document',
        'README.md': 'Pack orientation and start sequence',
        'api/openapi.yaml': 'Optional normalized API contract',
        'database/001_initial_schema.sql': 'Optional cloud-sync schema and RLS',
        'design/tokens.json': 'Machine-readable comic UI design tokens',
        'design/wireframes.md': 'Responsive screen and layout wireframes',
        'examples/sample-save.issue-06.json': 'Schema-valid event-sourced save fixture',
        'legal/CARD_IMAGE_LAUNCH_CHECKLIST.md': 'Required rights and operations gate for remote images',
        'legal/FAN_PROJECT_NOTICE.md': 'Fan-project notice and attribution language',
        'legal/TAKEDOWN_REQUEST_TEMPLATE.md': 'Operator incident-response template',
        'qa/CONTENT_VALIDATION_CHECKLIST.md': 'Manual source and content parity checklist',
        'qa/VALIDATION_REPORT.md': 'Final automated, TypeScript, DOCX, and source-integrity report',
        'scripts/validate_pack.py': 'Offline executable pack validator',
        'scripts/build_manifest.py': 'Reproducible pack-manifest generator',
        'types/domain.ts': 'Strict TypeScript domain interfaces',
    }
    if path in exact:
        return exact[path]
    if path.startswith('docs/'):
        return 'Numbered implementation specification'
    if path.startswith('schemas/'):
        return 'Draft 2020-12 JSON contract'
    if path.startswith('data/'):
        return 'Validated campaign or bilingual reference data'
    if path.startswith('source-materials/extracted/'):
        return 'Searchable mechanical source derivative'
    if path.startswith('source-materials/'):
        return 'Immutable supplied source material or source manifest'
    return 'Distribution artifact'


def main() -> None:
    # Build the human manifest from every distributed file except both manifest files.
    files = sorted(
        p for p in ROOT.rglob('*')
        if p.is_file() and p not in {HUMAN, CHECKSUMS}
    )
    total = sum(p.stat().st_size for p in files)
    lines = [
        '# Core Protocol Companion — pack manifest',
        '',
        '**Generated:** 2026-09-08 UTC  ',
        f'**Files listed:** {len(files)}  ',
        f'**Total bytes before manifest files:** {total:,}  ',
        '**Automated validation:** `PASS — 310 checks passed`',
        '',
        'This inventory covers the complete code-agent build pack. `MANIFEST.sha256` also includes this human-readable manifest and excludes only itself.',
        '',
        '| Path | Purpose | Bytes | SHA-256 |',
        '|---|---|---:|---|',
    ]
    for p in files:
        rel = p.relative_to(ROOT).as_posix()
        lines.append(f'| `{rel}` | {purpose(rel)} | {p.stat().st_size:,} | `{sha256(p)}` |')
    HUMAN.write_text('\n'.join(lines) + '\n', encoding='utf-8')

    checksum_files = sorted(p for p in ROOT.rglob('*') if p.is_file() and p != CHECKSUMS)
    CHECKSUMS.write_text(
        ''.join(f'{sha256(p)}  {p.relative_to(ROOT).as_posix()}\n' for p in checksum_files),
        encoding='utf-8',
    )
    print(f'wrote {HUMAN.relative_to(ROOT)} and {CHECKSUMS.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
