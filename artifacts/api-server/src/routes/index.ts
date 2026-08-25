import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import categoriesRouter from "./categories";
import offersRouter from "./offers";
import ordersRouter from "./orders";

const router: IRouter = Router();

router.use(healthRouter);
router.use(productsRouter);
router.use(categoriesRouter);
router.use(offersRouter);
router.use(ordersRouter);

export default router;
