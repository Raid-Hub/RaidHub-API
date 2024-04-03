source ~/.nvm/nvm.sh
export BUN_INSTALL="$HOME/.bun"
export PATH=$BUN_INSTALL/bin:$PATH

nvm use 20

temp_dir=$(mktemp -d)

git clone git@github.com:Raid-Hub/RaidHub-API.git "$temp_dir"
cd $temp_dir

bun install --frozen-lockfile
bun prisma generate
bun compile $2

mv $temp_dir/$2 ~/../RaidHub/API/$2
rm -rf "$temp_dir"

sudo systemctl restart $2