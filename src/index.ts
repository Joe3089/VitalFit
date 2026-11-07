import { Client } from './client';
import {
  AuthService,
  UserService,
  BranchService,
  PaymentMethodService,
  InstructorService,
  RBACService,
  MembershipService,
  PublicService,
  EquipmentService,
  ScheduleService,
  PackagesService,
  BillingService,
  BookingService,
  AccessService,
  ReportService,
  StaffService,
  WishListService,
  PolicyService,
  AuditService,
  NotificationService,
  ExportsService,
  RoutineService,
  LLMService,
  CRMService,
  InsightsService,
} from './services';
import { MarketingService } from './services/marketing';
import { ProductsService } from './services/products';

export class VitalFit {
  private static instance: VitalFit;
  client: Client;
  auth: AuthService;
  user: UserService;
  branch: BranchService;
  paymentMethod: PaymentMethodService;
  instructor: InstructorService;
  RBAC: RBACService;
  marketing: MarketingService;
  membership: MembershipService;
  public: PublicService;
  products: ProductsService;
  equipment: EquipmentService;
  schedule: ScheduleService;
  packages: PackagesService;
  billing: BillingService;
  booking: BookingService;
  access: AccessService;
  report: ReportService;
  staff: StaffService;
  wishList: WishListService;
  policy: PolicyService;
  audit: AuditService;
  notification: NotificationService;
  exports: ExportsService;
  routine: RoutineService;
  llm: LLMService;
  crm: CRMService;
  insights: InsightsService;

  constructor(isDevMode: boolean, origin?: string, baseURL?: string) {
    this.client = new Client(isDevMode, origin, baseURL);
    this.auth = new AuthService(this.client);
    this.user = new UserService(this.client);
    this.branch = new BranchService(this.client);
    this.paymentMethod = new PaymentMethodService(this.client);
    this.instructor = new InstructorService(this.client);
    this.RBAC = new RBACService(this.client);
    this.marketing = new MarketingService(this.client);
    this.membership = new MembershipService(this.client);
    this.public = new PublicService(this.client);
    this.products = new ProductsService(this.client);
    this.equipment = new EquipmentService(this.client);
    this.schedule = new ScheduleService(this.client);
    this.packages = new PackagesService(this.client);
    this.billing = new BillingService(this.client);
    this.booking = new BookingService(this.client);
    this.access = new AccessService(this.client);
    this.report = new ReportService(this.client);
    this.staff = new StaffService(this.client);
    this.wishList = new WishListService(this.client);
    this.policy = new PolicyService(this.client);
    this.audit = new AuditService(this.client);
    this.notification = new NotificationService(this.client);
    this.exports = new ExportsService(this.client);
    this.routine = new RoutineService(this.client);
    this.llm = new LLMService(this.client);
    this.crm = new CRMService(this.client);
    this.insights = new InsightsService(this.client);
  }

  /**
   * @param baseURL API URL including /v1; when empty the built-in URL is used.
   */
  static getInstance(isDevMode = false, baseURL?: string): VitalFit {
    if (!VitalFit.instance) {
      VitalFit.instance = new VitalFit(
        isDevMode,
        undefined,
        baseURL || undefined,
      );
    }
    return VitalFit.instance;
  }

  version(): string {
    return '0.5.0';
  }
}

export * from './types';
export * from './errors';
