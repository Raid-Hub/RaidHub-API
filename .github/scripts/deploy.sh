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

bun install --frozen-lockfile
bun prisma generate
bun run compile $2

mv $temp_dir/$2 ~/../RaidHub/API/$2
if [ $? -ne 0 ]; then
    exit 1
fi

rm -rf "$temp_dir"
if [ $? -ne 0 ]; then
    exit 1
fi

sudo systemctl restart $2