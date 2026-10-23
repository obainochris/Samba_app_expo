import { Router, type IRouter } from "express";
import healthRouter from "./health";
import marketplaceRouter from "./marketplace";
import adminRouter from "./admin";
import providerRouter from "./provider";

const router: IRouter = Router();

router.use(healthRouter);
router.use(marketplaceRouter);
router.use(adminRouter);
router.use(providerRouter);

export default router;
