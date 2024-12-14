import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import * as Location from "expo-location";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";

type LanguageTranslations = {
  days: string[];
  moonPhases: {
    [key: string]: string;
  };
};

const WEATHER_API_KEY = "https://www.weatherapi.com/"; // Fazer conta e pegar chave

const translations: { pt: LanguageTranslations; en: LanguageTranslations } = {
  pt: {
    days: [
      "Domingo",
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado",
    ],
    moonPhases: {
      "New Moon": "Lua Nova",
      "Waxing Crescent": "Lua Crescente",
      "First Quarter": "Quarto Crescente",
      "Waxing Gibbous": "Lua Gibosa Crescente",
      "Full Moon": "Lua Cheia",
      "Waning Gibbous": "Lua Gibosa Minguante",
      "Last Quarter": "Quarto Minguante",
      "Waning Crescent": "Lua Minguante",
    },
  },
  en: {
    days: [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
    moonPhases: {
      "New Moon": "New Moon",
      "Waxing Crescent": "Waxing Crescent",
      "First Quarter": "First Quarter",
      "Waxing Gibbous": "Waxing Gibbous",
      "Full Moon": "Full Moon",
      "Waning Gibbous": "Waning Gibbous",
      "Last Quarter": "Last Quarter",
      "Waning Crescent": "Waning Crescent",
    },
  },
};

interface WeatherData {
  location: {
    name: string;
    region: string;
    country: string;
    localtime: string;
  };
  current: {
    temp_c: number;
    temp_f: number;
    condition: {
      text: string;
      icon: string;
    };
    wind_kph: number;
    wind_degree: number;
    wind_dir: string;
    pressure_mb: number;
    precip_mm: number;
    humidity: number;
    feelslike_c: number;
    uv: number;
    air_quality: {
      "gb-defra-index": number;
      "us-epa-index": number;
      pm2_5: number;
      pm10: number;
      so2: number;
      no2: number;
      o3: number;
      co: number;
    };
  };
  forecast: {
    forecastday: Array<{
      date: string;
      day: {
        maxtemp_c: number;
        mintemp_c: number;
        condition: {
          text: string;
          icon: string;
        };
        daily_chance_of_rain: number;
      };
      astro: {
        sunset: string;
        sunrise: string;
        moonrise: string;
        moonset: string;
        moon_phase: string;
        moon_illumination: string;
      };
      hour: Array<{
        time: string;
        temp_c: number;
        condition: {
          text: string;
          icon: string;
        };
        wind_kph: number;
        humidity: number;
        feelslike_c: number;
        precip_mm: number;
        chance_of_rain: number;
      }>;
    }>;
  };
  alerts: {
    alert: Array<{
      event: string;
      desc: string;
      expires: string;
    }>;
  };
}

export default function WeatherApp() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [location, setLocation] = useState<string>("");
  const [language, setLanguage] = useState<"pt" | "en">("pt");
  const [loading, setLoading] = useState<boolean>(true);

  console.log(weatherData);

  useEffect(() => {
    if (weatherData) {
      fetchWeatherData(`${weatherData.location.name}`, language);
    }
  }, [language]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permissão negada",
          "Permissão para acessar localização foi negada"
        );
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      fetchWeatherData(
        `${currentLocation.coords.latitude},${currentLocation.coords.longitude}`,
        language
      );
    })();
  }, []);

  const fetchWeatherData = async (query: string, lang: "pt" | "en" = "pt") => {
    if (!query.trim()) {
      Alert.alert("Erro", "Por favor, insira uma localização válida");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `https://api.weatherapi.com/v1/forecast.json`,
        {
          params: {
            key: WEATHER_API_KEY,
            q: query,
            lang: lang,
            days: 3,
            aqi: "yes",
          },
        }
      );
      setWeatherData(response.data);
      setLocation("");
    } catch (error) {
      Alert.alert(
        "Erro",
        "Não foi possível buscar dados meteorológicos. Verifique a localização."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (location.trim()) {
      fetchWeatherData(location, language);
    } else {
      Alert.alert("Erro", "Por favor, insira uma localização");
    }
  };

  const renderWeatherDetails = () => {
    if (!weatherData) return null;

    const localTime = new Date(weatherData.location.localtime);
    const dayOfWeek = translations[language].days[localTime.getDay()];
    const localData = localTime.toLocaleDateString();

    return (
      <View style={styles.detailsContainer}>
        <View style={styles.locationHeader}>
          <Text style={styles.locationText}>
            {weatherData.location.name}, {weatherData.location.country}
          </Text>
          <Text>
            {dayOfWeek}, {localData}
          </Text>
        </View>

        <View style={styles.currentWeather}>
          <Text style={styles.temperatureText}>
            {Math.round(weatherData.current.temp_c)}°C
          </Text>
          <Image
            source={{ uri: `https:${weatherData.current.condition.icon}` }}
            style={styles.weatherIcon}
          />
          <Text>{weatherData.current.condition.text}</Text>
        </View>

        <View style={styles.weatherDetailsGrid}>
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>Vento</Text>
            <Text>Vel: {weatherData.current.wind_kph} km/h</Text>
            <Text>Dir: {weatherData.current.wind_dir}</Text>
          </View>
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>Pressão</Text>
            <Text>{weatherData.current.pressure_mb} mb</Text>
          </View>
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>Umidade</Text>
            <Text>{weatherData.current.humidity}%</Text>
          </View>
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>Sensação Térmica</Text>
            <Text>{Math.round(weatherData.current.feelslike_c)}°C</Text>
          </View>
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>UV</Text>
            <Text>{weatherData.current.uv}</Text>
          </View>
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>Fase da Lua</Text>
            <Text>
              {
                translations[language].moonPhases[
                  weatherData.forecast.forecastday[0].astro.moon_phase
                ]
              }
            </Text>
          </View>
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>Nascer do Sol</Text>
            <Text>{weatherData.forecast.forecastday[0].astro.sunrise}</Text>
          </View>
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>Pôr do Sol</Text>
            <Text>{weatherData.forecast.forecastday[0].astro.sunset}</Text>
          </View>
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>Precipitação</Text>
            <Text>{weatherData.current.precip_mm}</Text>
          </View>
        </View>

        <View style={styles.airQualityContainer}>
          {weatherData.current.air_quality["gb-defra-index"] <= 3 && (
            <Text style={styles.sectionTitle}>Qualidade do Ar Boa</Text>
          )}

          {weatherData.current.air_quality["gb-defra-index"] >= 4 &&
            weatherData.current.air_quality["gb-defra-index"] <= 6 && (
              <Text style={styles.sectionTitle}>Qualidade do Ar Moderada</Text>
            )}

          {weatherData.current.air_quality["gb-defra-index"] >= 7 &&
            weatherData.current.air_quality["gb-defra-index"] <= 9 && (
              <Text style={styles.sectionTitle}>Qualidade do Ar Ruim</Text>
            )}

          {weatherData.current.air_quality["gb-defra-index"] === 10 && (
            <Text style={styles.sectionTitle}>Qualidade do Ar Muito Ruim</Text>
          )}

          <View style={styles.airQualityDetails}>
            <Text>
              Índice GB-Defra:
              {weatherData.current.air_quality["gb-defra-index"]}
            </Text>

            {/* <Text>
              Índice EPA: {weatherData.current.air_quality["us-epa-index"]}
            </Text> */}
            <Text>PM2.5: {weatherData.current.air_quality.pm2_5}</Text>
            <Text>PM10: {weatherData.current.air_quality.pm10}</Text>
            <Text>SO2: {weatherData.current.air_quality.so2}</Text>
            <Text>NO2: {weatherData.current.air_quality.no2}</Text>
            <Text>O3: {weatherData.current.air_quality.o3}</Text>
            <Text>CO: {weatherData.current.air_quality.co}</Text>
          </View>
        </View>

        {renderForecast()}
        {renderHourlyForecast()}
      </View>
    );
  };

  const renderForecast = () => {
    if (!weatherData?.forecast?.forecastday) return null;

    return (
      <View style={styles.forecastContainer}>
        <Text style={styles.sectionTitle}>Previsão 3 Dias</Text>
        {weatherData.forecast.forecastday.map((day, index) => {
          // console.log(day.date);

          return (
            <View key={index} style={styles.forecastDay}>
              <Text style={styles.forecastDate}>
                {translations[language].days[new Date(day.date).getDay() + 1]}
              </Text>
              <Text>
                {Math.round(day.day.maxtemp_c)}°C /{" "}
                {Math.round(day.day.mintemp_c)}°C
              </Text>
              <Text>{day.day.condition.text}</Text>
              <Image
                source={{ uri: `https:${day.day.condition.icon}` }}
                style={styles.forecastIcon}
              />
              <Text>Chances de chuva: {day.day.daily_chance_of_rain} %</Text>
              <Text>
                Fase da Lua:{" "}
                {translations[language].moonPhases[day.astro.moon_phase]}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderHourlyForecast = () => {
    if (!weatherData?.forecast?.forecastday[0]?.hour) return null;
    // console.log(weatherData?.forecast?.forecastday[0].hour);

    return (
      <View style={styles.forecastContainer}>
        <Text style={styles.sectionTitle}>Previsão Horária</Text>
        <ScrollView horizontal>
          {weatherData.forecast.forecastday[0].hour.map((hour, index) => (
            <View key={index} style={styles.forecastDay}>
              <Text>{new Date(hour.time).getHours()}:00</Text>
              <Image
                source={{ uri: `https:${hour.condition.icon}` }}
                style={styles.forecastIcon}
              />
              <Text style={{ color: "#006fd5" }}>{hour.chance_of_rain} %</Text>
              <Text>{Math.round(hour.temp_c)}°C</Text>
              {/* <Text>{hour.condition.text}</Text> */}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por localização"
          value={location}
          onChangeText={setLocation}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Buscar</Text>
        </TouchableOpacity>
        <Picker
          selectedValue={language}
          style={styles.languagePicker}
          onValueChange={(itemValue) => setLanguage(itemValue)}
        >
          <Picker.Item label="Português" value="pt" />
          <Picker.Item label="English" value="en" />
        </Picker>
      </View>

      {loading ? (
        <Text>Carregando...</Text>
      ) : (
        <ScrollView>{renderWeatherDetails()}</ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
    backgroundColor: "#f9f9f9",
  },
  searchButton: {
    padding: 10,
    backgroundColor: "#4CAF50",
    borderRadius: 5,
  },
  searchButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  languagePicker: {
    marginLeft: 10,
    height: 40,
    width: 120,
  },
  detailsContainer: {
    flex: 1,
    padding: 20,
  },
  locationHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  locationText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
    color: "#333",
  },
  currentWeather: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  temperatureText: {
    fontSize: 52,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  weatherIcon: {
    width: 100,
    height: 100,
    marginVertical: 10,
  },
  weatherDetailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  detailCard: {
    width: "48%",
    backgroundColor: "#e0e0e0",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  detailTitle: {
    fontWeight: "bold",
    fontSize: 16,
  },
  airQualityContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#ffffff",
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
    color: "#333",
  },
  airQualityDetails: {
    marginTop: 10,
  },
  forecastContainer: {
    marginTop: 20,
  },
  forecastDay: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    marginRight: 5,
  },
  forecastDate: {
    fontWeight: "bold",
    fontSize: 16,
  },
  forecastDetails: {
    marginTop: 10,
    alignItems: "center",
  },
  forecastIcon: {
    width: 50,
    height: 50,
    marginTop: 5,
  },
});
