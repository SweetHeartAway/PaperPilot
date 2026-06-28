---
name: tag-feature-patterns
description: Patterns used for implementing the Tag model, CRUD routes, and paper-tag association
metadata:
  type: reference
---

Tag feature implementation patterns:

- **Model**: `models/tag.py` — Tag ORM model with `paper_tags` association table using `Table()`, `ForeignKey(ondelete="CASCADE")`, and bidirectional `relationship(secondary="paper_tags", back_populates=...)`
- **Paper model**: Add `tags = relationship("Tag", secondary="paper_tags", back_populates="papers")` — uses string table name `"paper_tags"` since the Table object is registered in `Base.metadata` via `tag.py`
- **Schema**: `schemas/tag.py` — TagCreate, TagUpdate (single `name` field), Tag (response with id/name/created_at), TagDetail (adds `paper_count`), TagName (request body for paper-tag association)
- **Paper schema**: Add `tags: List[TagSchema] = []` to existing Paper schema — returns tags in all paper responses
- **Service**: `services/tag_service.py` — `create_tag` trims whitespace + unique check; `add_tag_to_paper` auto-creates tag if not exists + idempotent append; `delete_tag` uses `db.delete()` which SQLAlchemy auto-handles secondary table cleanup
- **Route**: Tag CRUD in `api/v1/tags.py`; paper-tag association routes live in `api/v1/papers.py` (POST/DELETE on `/{paper_id}/tags`)
- **Error handling**: Service raises `ValueError`, route catches and maps to 404 for "不存在" messages, 400 otherwise
- **Imports in __init__.py**: `from app.models.tag import Tag` ensures `Base.metadata` registers `paper_tags` table
- **conftest.py**: Must import `Tag` for test DB table registration
