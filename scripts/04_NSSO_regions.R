library(tidyverse)

df <- read_csv("~/github/2025_NSSO_regions/nsso_76_regions.csv")
lgd <- read_csv("public/bharatviz-lgd-district-template.csv")
lgd$`some column name` <- NULL
lgd$LGD <- TRUE
df$state[df$state %in% c("Dadra & Nagar Haveli", "Daman & Diu")] <-"Dadra & Nagar Haveli & Daman & Diu"
df$state[df$state == "Delhi"] <- "Nct Of Delhi"
nsso.state.district <- df %>%
  select(state, district, nss_region, nss_region_code) %>%
  arrange(state, district) %>%
  unique()
colnames(nsso.state.district) <- c("state_name", "district_name", "nss_region", "nss_region_code")

nsso.state.district$NSSO <- TRUE

nfhs4.districts <- read_csv(here("public/India_NFHS4_state_district_list.csv"))
nfhs4.districts$state_name[nfhs4.districts$state_name== "Andaman and Nicobar Islands"] <- "Andaman & Nicobar Islands"
nfhs4.districts$state_name[nfhs4.districts$state_name== "Dadra and Nagar Haveli"] <- "Dadra & Nagar Haveli & Daman & Diu"
nfhs4.districts$state_name[nfhs4.districts$state_name== "Daman and Diu"] <- "Dadra & Nagar Haveli & Daman & Diu"
nfhs4.districts$state_name[nfhs4.districts$state_name== "Delhi"] <- "Nct Of Delhi"
nfhs4.districts$state_name[nfhs4.districts$state_name== "Himanchal Pradesh"] <- "Himachal Pradesh"

nfhs4.districts$NFHS4 <- TRUE
nfhs5.districts <- read_csv(here("public/India_NFHS5_state_district_list.csv"))
nfhs5.districts$NFHS5 <- TRUE

setdiff(nfhs5.districts$state_name,nsso.state.district$state_name)
setdiff(nsso.state.district$state_name, nfhs5.districts$state_name)

setdiff(nfhs4.districts$state_name,nsso.state.district$state_name)
setdiff(nsso.state.district$state_name, nfhs4.districts$state_name)

setdiff(lgd$state_name,nsso.state.district$state_name)
setdiff(nsso.state.district$state_name, lgd$state_name)

nsso.state.district$nsso_district_name <- nsso.state.district$district_name
nsso.state.district$district_name <- str_to_title(gsub(pattern = " ", replacement = "", x = nsso.state.district$district_name))

nfhs4.districts$NFHS4_district_name <- nfhs4.districts$district_name
nfhs4.districts$district_name <- str_to_title(gsub(pattern = " ", replacement = "", x = nfhs4.districts$district_name))

nfhs5.districts$NFHS5_district_name <- nfhs5.districts$district_name
nfhs5.districts$district_name <- str_to_title(gsub(pattern = " ", replacement = "", x = nfhs5.districts$district_name))

nfhs4.districts$reg_code <- NULL
nfhs5.districts$reg_code <- NULL

df.nfhs4.nfhs5 <- nsso.state.district %>% left_join(nfhs4.districts) %>% left_join(nfhs5.districts) %>% left_join(lgd)
table(df.nfhs4.nfhs5$NSSO)
table(df.nfhs4.nfhs5$NFHS4)
table(df.nfhs4.nfhs5$NFHS5)
table(df.nfhs4.nfhs5$LGD)


df.nfhs4 <- nsso.state.district %>% left_join(nfhs4.districts)
df.nfhs4.missing <- df.nfhs4 %>% filter(is.na(NFHS4))
table(df.nfhs4.missing$state_name)

df.nfhs5 <- nsso.state.district %>% left_join(nfhs5.districts)
df.nfhs5.missing <- df.nfhs5 %>% filter(is.na(NFHS5))
df.nfhs5.missing

statewise <- table(df$state, df$nss_region) %>% as.data.frame() %>% filter(Freq>0) %>% View()
nfhs5.districts.join <- left_join(nfhs5.districts, nsso.state.district)
nfhs5.missing <- nfhs5.districts.join %>% filter(is.na(NSSO))
nfhs5.missing
nfhs5.districts.join$nsso_state_region <- paste(nfhs5.districts.join$state_name, nfhs5.districts.join$nss_region, sep = " - ")
nsso.state.district$state_nsso_region <- paste(nsso.state.district$state_name, nsso.state.district$nss_region, sep = " - ")
write_csv(nsso.state.district, "~/github/2025_NSSO_regions/India_NSSO_state_region_list.csv")
nfhs5.districts.join$district_name <- nfhs5.districts.join$NFHS5_district_name
write_csv(nfhs5.districts.join, "~/github/2025_NSSO_regions/India_NFHS5_NSSO_regions_joined.csv")

statewise <- table(df$state, df$nss_region) %>% as.data.frame() %>% filter(Freq>0)  %>% arrange(Var1)
View(statewise)
