import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class UpdateWebhookDto {
  @ApiPropertyOptional({ example: "GitHub" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: "github" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: "path must be url-safe (letters, numbers, '_' or '-')",
  })
  path?: string;

  @ApiPropertyOptional({ example: "my_secret" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  secret?: string | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: { event: "push" } })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown> | null;
}
