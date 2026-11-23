import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { ORDER_STATUSES, orderInputSchema, orderTransitionSchema } from '@measuremate/validation';
import { Perm, Validates, ValidatesQuery } from '../../common/decorators';
import { Q, paginationShape, paged } from '../../common/query';
import { OrdersService } from './orders.service';

const listQuery = z.object({
  q: z.string().max(100).optional(), status: z.enum(ORDER_STATUSES).optional(), customerId: z.string().uuid().optional(),
  ...paginationShape,
});

@ApiTags('Orders')
@Controller()
export class OrdersController {
  constructor(private readonly svc: OrdersService) {}

  @Post('orders') @Perm('order.create') @Validates(orderInputSchema)
  create(@Body() body: z.infer<typeof orderInputSchema>) { return this.svc.create(body); }

  @Get('orders') @Perm('order.view') @ValidatesQuery(listQuery)
  async list(@Q() q: z.infer<typeof listQuery>) {
    const r = await this.svc.list(q);
    return { ...paged(r.data, r.total, q.page, q.pageSize), statusCounts: r.statusCounts };
  }

  @Get('orders/:id') @Perm('order.view')
  get(@Param('id', ParseUUIDPipe) id: string) { return this.svc.get(id); }

  // Route needs order.view; the service enforces the specific permission for the requested transition.
  @Post('orders/:id/status') @Perm('order.view') @HttpCode(200) @Validates(orderTransitionSchema)
  transition(@Param('id', ParseUUIDPipe) id: string, @Body() body: z.infer<typeof orderTransitionSchema>) { return this.svc.transition(id, body); }
}
