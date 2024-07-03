export class CurrencyFormat {
  private readonly lang: string;

  /**
   * Creates an instance of CurrencyFormat.
   * @param lang - The locale language code to be used for formatting.
   * @throws Will throw an error if the lang parameter is not a valid string.
   */
  constructor(lang: string) {
    if (!lang) {
      throw new Error("Language code is required.");
    }
    this.lang = lang;
  }

  /**
   * Formats a given value as currency.
   * @param value - The numeric value to be formatted.
   * @param currency - The currency code (e.g., 'USD', 'EUR') to format the value in.
   * @returns A string representing the formatted currency value.
   * @throws Will throw an error if the currency parameter is not a valid string.
   */
  format(value: number, currency: string): string {
    if (!currency) {
      throw new Error("Currency code is required.");
    }

    return new Intl.NumberFormat(this.lang, {
      style: "currency",
      currency,
    }).format(value);
  }
}
