interface CurrencyData {
  result: string;
  conversion_rates: ConversionRates;
}

interface ConversionRates {
  [key: string]: number;
}

interface CodesData {
  result: string;
  supported_codes: [string, string][];
}

export class ExchangeRate {
  private readonly exchangeRateBaseUrl = "https://v6.exchangerate-api.com/v6/";
  private exchangeRateApiKey: string | null = null;
  private currencies: { code: string; name: string }[] = [];
  private rates: { [key: string]: ConversionRates } = {};
  private updatedAt: Date | null = null;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("API key is required.");
    }
    this.exchangeRateApiKey = apiKey;
  }

  /**
   * Fetches data from the exchange rate API.
   * @param endpoint The API endpoint to fetch data from.
   * @returns A promise that resolves to the fetched currency data or null in case of an error.
   */
  private async fetchApiData(endpoint: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.exchangeRateBaseUrl}/${this.exchangeRateApiKey}/${endpoint}`
      );
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error("Error fetching currency data:", error);
      return null;
    }
  }

  /**
   * Fetches the list of available currencies and updates the `currencies` property.
   */
  private async fetchCurrencies(): Promise<void> {
    const data = (await this.fetchApiData("/codes")) as CodesData;
    if (data && data.result === "success") {
      this.currencies = data.supported_codes.map(([code, name]) => ({
        code,
        name,
      }));
    }
  }

  /**
   * Fetches the exchange rates for a given currency code.
   * @param code The currency code to fetch rates for.
   * @returns A promise that resolves to the exchange rates or null in case of an error.
   */
  async fetchRates(code: string): Promise<ConversionRates | null> {
    if (
      !this.updatedAt ||
      new Date().getTime() - this.updatedAt.getTime() > 3600000
    ) {
      const data = (await this.fetchApiData(`/latest/${code}`)) as CurrencyData;
      if (data && data.result === "success") {
        this.rates[code] = data.conversion_rates;
      }
    }
    return this.rates[code] || null;
  }

  /**
   * Converts an amount from one currency to another.
   * @param from The currency code to convert from.
   * @param to The currency code to convert to.
   * @param amount The amount to convert.
   * @returns A promise that resolves to the converted amount or null in case of an error.
   */
  async convert(
    from: string,
    to: string,
    amount: number
  ): Promise<number | null> {
    if (!this.currencies.some((currency) => currency.code === from)) {
      throw new Error(`Invalid currency: ${from}`);
    }
    if (!this.currencies.some((currency) => currency.code === to)) {
      throw new Error(`Invalid currency: ${to}`);
    }
    const data = await this.fetchRates(from);
    if (!data) {
      return null;
    }
    const rate = data[to];
    if (!rate) {
      throw new Error(`Exchange rate not found for ${from} to ${to}`);
    }
    return amount * rate;
  }

  /**
   * Gets the list of available currencies.
   * @returns A promise that resolves to an array of currency codes.
   */
  async getCurrencies(): Promise<string[]> {
    if (this.currencies.length === 0) {
      await this.fetchCurrencies();
    }
    return this.currencies.map((currency) => currency.code);
  }

  /**
   * Gets the list of available currencies with their names.
   * @returns A promise that resolves to an array of currency objects.
   */
  async getCurrenciesWithNames(): Promise<{ code: string; name: string }[]> {
    if (this.currencies.length === 0) {
      await this.fetchCurrencies();
    }
    return this.currencies;
  }

  /**
   * Get the name of a currency given its code.
   * @param code The currency code.
   * @returns A promise that resolves to the currency name or null if the code is not found.
   */
  async getCurrencyName(code: string): Promise<string | null> {
    if (this.currencies.length === 0) {
      await this.fetchCurrencies();
    }
    const currency = this.currencies.find((c) => c.code === code);
    return currency ? currency.name : null;
  }
}
