import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetCurrentUserId = createParamDecorator(
  (_: string | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();

    return request.user['sub'];
  },
);
