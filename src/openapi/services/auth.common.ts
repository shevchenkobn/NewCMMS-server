import { inject, injectable } from 'inversify';
import { AuthService } from '../../services/auth.service';

@injectable()
export class AuthCommon {
  public readonly authService: AuthService;

  constructor(@inject(AuthService) authService: AuthService) {
    this.authService = authService;
  }
}
