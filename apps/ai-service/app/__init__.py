"""
Ethos AI Microservice application package.
"""
from __future__ import annotations

import inspect
import starlette.routing

# Compatibility shim for environments where Starlette >= 1.0 is installed alongside FastAPI <= 0.115
_orig_router_init = starlette.routing.Router.__init__
if "on_startup" not in inspect.signature(_orig_router_init).parameters:
    def _compat_router_init(
        self: starlette.routing.Router,
        *args: object,
        on_startup: object = None,
        on_shutdown: object = None,
        lifespan: object = None,
        **kwargs: object,
    ) -> None:
        _orig_router_init(self, *args, **kwargs)  # type: ignore
        if not hasattr(self, "on_startup"):
            self.on_startup = []  # type: ignore[attr-defined]
        if not hasattr(self, "on_shutdown"):
            self.on_shutdown = []  # type: ignore[attr-defined]

    starlette.routing.Router.__init__ = _compat_router_init  # type: ignore[method-assign]
