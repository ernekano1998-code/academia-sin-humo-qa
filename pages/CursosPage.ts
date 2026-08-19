import { type Page, type Locator } from '@playwright/test';

export class CursosPage {
  readonly page: Page;
  readonly verCursosLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.verCursosLink = page.getByRole('link', { name: 'Ver cursos' });
  }

  async irDesdeBienvenida() {
    await this.verCursosLink.click();
  }

  cursoCard(titulo: string): Locator {
    return this.page.getByRole('heading', { name: titulo }).locator('..').locator('..');
  }

  botonInscribirse(titulo: string): Locator {
    return this.cursoCard(titulo).getByRole('button', { name: 'Inscribirse' });
  }

  badgeEstado(titulo: string): Locator {
    return this.cursoCard(titulo).getByText(/^(Inscrito|En progreso|Completado|Certificado)$/);
  }
}
