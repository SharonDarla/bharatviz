library(tidyverse)

df <- read_csv("https://raw.githubusercontent.com/pratapvardhan/NFHS-5/refs/heads/master/NFHS-5-Districts.csv")
df.grouped <- df %>% group_by(Indicator) %>% summarise(n = n()) %>% arrange(-n)
df.filtered <- df %>% filter(Indicator == "88. Blood sugar level - high or very high (>140 mg/dl) or taking medicine to control blood sugar level23 (%)") %>% select(State, District, `NFHS-5`)
colnames(df.filtered) <- c("state_name", "district_name", "% of people with high blood sugar level")
write_csv(df.filtered, "nfhs5_blood_sugar_levels.csv")

df <- read_csv("public/NFHS5_districts_all_indicators.csv")
df.select <- df %>% select(`State/UT`, `District Names`, `Men age 15 years and above wih high or very high (>140 mg/dl) Blood sugar level  or taking medicine to control blood sugar level23 (%)`)

colnames(df.select) <- c("state_name", "district_name", "% of men with high blood sugar level")
df.select$state_name[df.select$state_name == "Maharastra"] <- "Maharashtra"
write_csv(df.select, "public/nfhs5_blood_sugar_levels.csv")

nfhs4 <- read_csv("https://github.com/HindustanTimesLabs/nfhs-data/raw/refs/heads/master/nfhs_district-wise.csv")
nfhs4.select <- nfhs4 %>% select(state, district, indicator_name, total) %>% filter(indicator_name %in%  c("Blood sugar level - high (>140 mg/dl) (%)")

    #                                                                                    c("Blood sugar level - high (>140 mg/dl) (%)")
                                                                                    )
nfhs4.select$indicator_name <- NULL
colnames(nfhs4.select) <- c("state_name", "district_name",  "% of people with high blood sugar")
nfhs4.select <- nfhs4.select %>% arrange(state_name, district_name)
nfhs4.select$`% of people with high blood sugar` <- as.numeric(nfhs4.select$`% of people with high blood sugar`)
nfhs4.select$`% of people with high blood sugar`[nfhs4.select$`% of people with high blood sugar` <0] <- NA
nfhs4.select$`% of people with high blood sugar`[nfhs4.select$district_name=="Kolkata"] <- NA
write_csv(nfhs4.select, "public/nfhs4_blood_sugar_levels.csv")

