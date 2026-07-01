from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    """更新用户资料（所有字段可选）"""

    username: str | None = Field(None, min_length=3, max_length=50)
    email: EmailStr | None = None
    ai_api_key: str | None = None
    ai_base_url: str | None = None
    ai_model: str | None = None
    default_prompt_template_id: int | None = None


class ChangePasswordRequest(BaseModel):
    """修改密码请求"""

    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)


class User(UserBase):
    id: int
    is_active: bool = True
    avatar_uuid: str | None = None
    avatar_url: str | None = None
    ai_api_key: str | None = None
    ai_base_url: str | None = None
    ai_model: str | None = None
    default_prompt_template_id: int | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class UserInDB(User):
    hashed_password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: str | None = None
