import { expect, Page } from '@playwright/test';
import { ODOO_URL } from '../configs/globalSetup';
import { delay, patientName } from './openmrs';

export class Odoo {
  constructor(readonly page: Page) {}

  async open() {
    await this.page.goto(`${ODOO_URL}`);
    await this.page.locator('#login').fill(`${process.env.ODOO_USERNAME}`);
    await this.page.locator('#password').fill(`${process.env.ODOO_PASSWORD}`);
    await this.page.getByRole('button', { name: /log in/i }).click();
    await expect(this.page).toHaveURL(/.*web/);
  }

  async searchCustomer() {
    await expect(this.page.locator('.o_searchview_input')).toBeVisible();
    await this.page.locator('.o_searchview_input').fill(`${patientName.firstName + ' ' + patientName.givenName}`);
    await this.page.locator('.o_searchview_input').press('Enter');
    await delay(2000);
  }

  async navigateToSales() {
    await this.page.locator("//a[contains(@class, 'full')]").click();
    await expect(this.page.getByRole('menuitem', { name: /sales/i })).toBeVisible();
    await this.page.getByRole('menuitem', { name: /sales/i }).click();
    await expect(this.page.locator('.breadcrumb-item')).toHaveText(/quotations/i);
  }
}
