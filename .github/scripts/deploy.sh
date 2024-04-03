source ~/.nvm/nvm.sh
export BUN_INSTALL="$HOME/.bun"
export PATH=$BUN_INSTALL/bin:$PATH

nvm use 20

temp_dir=$(mktemp -d)

git clone -b $1 git@github.com:Raid-Hub/RaidHub-API.git "$temp_dir"
if [ $? -ne 0 ]; then
    exit 1
fi
cd $temp_dir

# Build the project
cp ~/../RaidHub/API-env/$2/* $temp_dir
bun install --frozen-lockfile
bun prisma generate
bun run compile $2

# Cleanup
mv $temp_dir/$2 ~/../RaidHub/API/$2
if [ $? -ne 0 ]; then
    exit 1
fi

rm -rf "$temp_dir"
if [ $? -ne 0 ]; then
    exit 1
fi

# Restart the service
sudo systemctl restart $2