"""AI 客户端 — 支持任意 OpenAI 兼容 API（DeepSeek/GLM/Qwen/OpenAI/Ollama）

通过配置 API_BASE_URL 切换模型，不和任何一家绑定。
不配置 API Key 时自动降级为桩实现（零成本兜底）。

使用示例：
    from app.utils.ai_client import ai_client

    result = ai_client.chat(
        system_prompt="你是一个论文分析助手",
        user_prompt="请分析这篇论文...",
    )
"""

import logging
from typing import Any

from app.core.config import settings
from openai import OpenAI

logger = logging.getLogger(__name__)


class AIClient:
    """AI 客户端封装

    通过 OpenAI 兼容 API 支持多模型切换：
    - DeepSeek:  base_url=https://api.deepseek.com
    - GLM-4:     base_url=https://open.bigmodel.cn/api/paas/v4
    - Qwen:      base_url=https://dashscope.aliyuncs.com/compatible-mode/v1
    - OpenAI:    base_url=https://api.openai.com/v1
    - Ollama:    base_url=http://localhost:11434/v1

    只需在 .env 中修改 AI_API_BASE_URL 和 AI_MODEL 即可切换。
    """

    def __init__(self):
        self._client: OpenAI | None = None
        self._stub = False
        self._init_client()

    def _init_client(self) -> None:
        """初始化客户端，无 API Key 时启用桩实现"""
        if not settings.AI_API_KEY:
            logger.info("AI_API_KEY 未配置，启用本地桩实现")
            self._stub = True
            return

        base_url = settings.AI_API_BASE_URL or None  # None → OpenAI 默认地址
        self._client = OpenAI(api_key=settings.AI_API_KEY, base_url=base_url)
        self._stub = False
        logger.info(
            "AI 客户端初始化完成: model=%s, base_url=%s",
            settings.AI_MODEL,
            base_url or "https://api.openai.com/v1",
        )

    @property
    def is_stub(self) -> bool:
        """是否为桩实现（未配置 API Key）"""
        return self._stub

    @property
    def model_name(self) -> str:
        """当前使用的模型名称"""
        return "stub-ai" if self._stub else settings.AI_MODEL

    def chat(
        self,
        system_prompt: str,
        user_prompt: str,
        *,
        temperature: float = 0.3,
        max_tokens: int | None = None,
        model: str | None = None,
        **kwargs: Any,
    ) -> str:
        """调用聊天补全 API

        Args:
            system_prompt: 系统提示词
            user_prompt: 用户提示词
            temperature: 生成温度（默认 0.3，适合分析类任务）
            max_tokens: 最大输出 token，默认使用 settings.AI_MAX_TOKENS
            model: 模型名称，默认使用 settings.AI_MODEL
            **kwargs: 传递给 OpenAI API 的其他参数

        Returns:
            模型回复文本

        Raises:
            RuntimeError: API 调用失败（仅真实客户端抛出，桩实现返回截断文本）
        """
        if self._stub:
            return self._stub_chat(user_prompt)

        try:
            response = self._client.chat.completions.create(  # type: ignore[union-attr]
                model=model or settings.AI_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=temperature,
                max_tokens=max_tokens or settings.AI_MAX_TOKENS,
                **kwargs,
            )
        except Exception as e:
            logger.error("AI API 调用失败: %s", e)
            raise RuntimeError(f"AI API 调用失败: {e}") from e

        content = response.choices[0].message.content or ""
        return content

    def _stub_chat(self, user_prompt: str) -> str:
        """无 API Key 时的桩实现：截取前 200 字符作为模拟回复"""
        cleaned = user_prompt.strip() if user_prompt else ""
        if not cleaned:
            return ""
        summary = cleaned[:200]
        if len(cleaned) > 200:
            summary += "…"
        return summary


# 全局单例
ai_client = AIClient()
