import { type Page, type Locator } from '@playwright/test';

export class RegistroPage {
  readonly page: Page;
  readonly nombreInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly edadInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nombreInput = page.getByTestId('register-name');
    this.emailInput = page.getByTestId('register-email');
    this.passwordInput = page.getByTestId('register-password');
    this.edadInput = page.getByTestId('register-age');
    this.submitButton = page.getByTestId('register-submit');
  }

  async goto() {
    await this.page.goto('/registro');
  }

  async registrar(datos: { nombre: string; email: string; password: string; edad: string }) {
    await this.nombreInput.fill(datos.nombre);
    await this.emailInput.fill(datos.email);
    await this.passwordInput.fill(datos.password);
    await this.edadInput.fill(datos.edad);
    await this.submitButton.click();
  }
}
