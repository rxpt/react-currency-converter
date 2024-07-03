import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  ButtonGroup,
} from "react-bootstrap";
import { ExchangeRate } from "./utils/exchangeRate";
import { CurrencyFormat } from "./utils/currencyFormat";

const exchangeRate = new ExchangeRate(
  process.env.REACT_APP_EXCHANGE_RATE_API_KEY as string
);
const currencyFormat = new CurrencyFormat("pt-BR");

type AppState = {
  loading: boolean;
  error: string | null;
};

type ConversorData = {
  from: string;
  to: string;
  rawAmount: string;
  amount: number;
  result: number;
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    loading: false,
    error: null,
  });
  const [currencies, setCurrencies] = useState<
    { code: string; name: string }[]
  >([]);
  const [conversorData, setConversorData] = useState<ConversorData>({
    from: "USD",
    to: "BRL",
    rawAmount: "",
    amount: 0,
    result: 0,
  });

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const fetchedCurrencies = await exchangeRate.getCurrenciesWithNames();
        setCurrencies(fetchedCurrencies);
      } catch (error) {
        setAppState({ loading: false, error: "Failed to fetch currencies" });
      }
    };
    fetchCurrencies();
  }, []);

  const handleStateUpdate = (newState: Partial<AppState>) =>
    setAppState((prev) => ({ ...prev, ...newState }));
  const handleConversorDataUpdate = (newData: Partial<ConversorData>) =>
    setConversorData((prev) => ({ ...prev, ...newData }));

  const fetchRates = async () => {
    handleStateUpdate({ loading: true, error: null });
    try {
      const result = (await exchangeRate.convert(
        conversorData.from,
        conversorData.to,
        conversorData.amount
      )) as number;
      handleConversorDataUpdate({
        result: parseFloat(result.toFixed(2)),
        rawAmount: currencyFormat.format(
          conversorData.amount,
          conversorData.from
        ),
      });
    } catch (error: any) {
      console.error("Error fetching currency data", error);
      handleStateUpdate({ error: error.message || "An error occurred" });
    } finally {
      handleStateUpdate({ loading: false });
    }
  };

  const handleValueChange = (value: string) => {
    const sanitizedValue = value.replace(",", ".");
    const amount = isNaN(parseFloat(sanitizedValue))
      ? 0
      : parseFloat(sanitizedValue);
    handleConversorDataUpdate({ rawAmount: sanitizedValue, amount });
  };

  const handleCurrencyChange = (key: keyof ConversorData, value: string) => {
    handleConversorDataUpdate({ [key]: value as string, result: 0 });
  };

  const resetConverter = () =>
    handleConversorDataUpdate({ result: 0, amount: 0, rawAmount: "" });
  const invertCurrencies = () => {
    handleConversorDataUpdate({
      from: conversorData.to,
      to: conversorData.from,
      result: conversorData.amount,
      amount: conversorData.result,
      rawAmount: currencyFormat.format(conversorData.result, conversorData.to),
    });
  };

  return (
    <Container>
      <h1>Conversor de Moedas</h1>
      <Row>
        <Col>
          <Form.Group as={Row}>
            <Form.Label column sm="2">
              De
            </Form.Label>
            <Col sm="10">
              <Form.Control
                as="select"
                value={conversorData.from}
                onChange={(e) => handleCurrencyChange("from", e.target.value)}
                className="mb-2"
              >
                {currencies.map(({ code, name }) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </Form.Control>
              <Form.Control
                value={conversorData.rawAmount}
                onChange={(e) =>
                  handleValueChange(e.target.value.replace(/[^\d,.]/g, ""))
                }
                placeholder="Digite o valor"
                className="mb-2"
              />
            </Col>
          </Form.Group>
          <Form.Group as={Row}>
            <Form.Label column sm="2">
              Para
            </Form.Label>
            <Col sm="10">
              <Form.Control
                as="select"
                value={conversorData.to}
                onChange={(e) => handleCurrencyChange("to", e.target.value)}
                className="mb-2"
              >
                {currencies.map(({ code, name }) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </Form.Control>
              <Form.Control
                readOnly
                value={currencyFormat.format(
                  conversorData.result,
                  conversorData.to
                )}
              />
            </Col>
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col className="text-center p-4">
          <ButtonGroup>
            <Button
              onClick={fetchRates}
              disabled={appState.loading}
              className="btn-success"
            >
              Converter
            </Button>
            <Button
              onClick={resetConverter}
              disabled={appState.loading}
              className="btn-warning"
            >
              Limpar
            </Button>
            <Button
              onClick={invertCurrencies}
              disabled={appState.loading}
              className="btn-info"
            >
              Inverter
            </Button>
          </ButtonGroup>
          {appState.error && <p className="text-danger">{appState.error}</p>}
        </Col>
      </Row>
    </Container>
  );
};

export default App;
