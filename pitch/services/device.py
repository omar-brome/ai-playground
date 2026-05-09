"""PyTorch device selection for MPS / CUDA / CPU."""

from __future__ import annotations


def get_device() -> str:
    import torch

    if torch.backends.mps.is_available():
        return "mps"
    if torch.cuda.is_available():
        return "cuda"
    return "cpu"


def device_startup_message(device: str) -> str:
    if device == "mps":
        return "⚡ Running on Apple MPS (M2 GPU)"
    if device == "cuda":
        return "⚡ Running on CUDA"
    return "🖥 Running on CPU"


def device_status_label(device: str) -> str:
    if device == "mps":
        return "⚡ MPS"
    if device == "cuda":
        return "⚡ CUDA"
    return "🖥 CPU"
